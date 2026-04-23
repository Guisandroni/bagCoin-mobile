import os
import pickle
from typing import Optional
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sqlmodel import Session, select
from ..database import engine
from ..models import Transaction
from ..logging_config import logger

MODEL_DIR = "/app/models"
os.makedirs(MODEL_DIR, exist_ok=True)

class UserCategoryClassifier:
    """Local text classifier that learns from a user's transaction history.

    Uses scikit-learn to predict category from description.
    Falls back to LLM when confidence is low or no training data exists.
    """

    def __init__(self, user_id: int):
        self.user_id = user_id
        self.model_path = os.path.join(MODEL_DIR, f"user_{user_id}_category.pkl")
        self.pipeline: Optional[Pipeline] = None
        self.min_samples = 5  # minimum transactions to train
        self.confidence_threshold = 0.75
        self._load()

    def _load(self):
        if os.path.exists(self.model_path):
            try:
                with open(self.model_path, "rb") as f:
                    self.pipeline = pickle.load(f)
                logger.info("classifier_loaded", user_id=self.user_id, path=self.model_path)
            except Exception as e:
                logger.warning("classifier_load_failed", user_id=self.user_id, error=str(e))
                self.pipeline = None

    def _save(self):
        if self.pipeline is None:
            return
        try:
            with open(self.model_path, "wb") as f:
                pickle.dump(self.pipeline, f)
            logger.info("classifier_saved", user_id=self.user_id, path=self.model_path)
        except Exception as e:
            logger.error("classifier_save_failed", user_id=self.user_id, error=str(e))

    def _fetch_training_data(self) -> pd.DataFrame:
        with Session(engine) as session:
            statement = (
                select(Transaction.description, Transaction.category)
                .where(Transaction.user_id == self.user_id)
                .where(Transaction.category.isnot(None))
                .where(Transaction.description.isnot(None))
            )
            rows = session.exec(statement).all()

        df = pd.DataFrame(rows, columns=["description", "category"])
        df = df.dropna()
        df = df[df["description"].str.strip() != ""]
        return df

    def can_predict(self) -> bool:
        return self.pipeline is not None

    def train(self) -> bool:
        df = self._fetch_training_data()
        if len(df) < self.min_samples:
            logger.info(
                "insufficient_training_data",
                user_id=self.user_id,
                samples=len(df),
                required=self.min_samples,
            )
            return False

        self.pipeline = Pipeline(
            [
                ("tfidf", TfidfVectorizer(lowercase=True, ngram_range=(1, 2))),
                ("clf", MultinomialNB()),
            ]
        )
        self.pipeline.fit(df["description"], df["category"])
        self._save()
        logger.info(
            "classifier_trained",
            user_id=self.user_id,
            samples=len(df),
            categories=df["category"].nunique(),
        )
        return True

    def predict(self, description: str) -> Optional[dict]:
        if not self.can_predict():
            return None

        try:
            proba = self.pipeline.predict_proba([description])[0]
            best_idx = proba.argmax()
            confidence = float(proba[best_idx])
            category = self.pipeline.classes_[best_idx]

            logger.info(
                "local_prediction",
                user_id=self.user_id,
                description=description,
                category=category,
                confidence=confidence,
            )

            if confidence >= self.confidence_threshold:
                return {
                    "category": category,
                    "confidence": confidence,
                    "source": "local_ml",
                }
            else:
                logger.info(
                    "low_confidence_fallback_to_llm",
                    user_id=self.user_id,
                    confidence=confidence,
                )
                return None
        except Exception as e:
            logger.error("local_prediction_error", user_id=self.user_id, error=str(e))
            return None

    def should_retrain(self, new_transactions_count: int = 1) -> bool:
        # Retrain every N new transactions
        return new_transactions_count >= 20


def get_classifier(user_id: int) -> UserCategoryClassifier:
    return UserCategoryClassifier(user_id)
