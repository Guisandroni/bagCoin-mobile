"use client"

import { NewTransactionModal } from "./new-transaction-modal"
import { TransactionDetailModal } from "./transaction-detail-modal"
import { FilterModal } from "./filter-modal"

export function Modals() {
  return (
    <>
      <NewTransactionModal />
      <TransactionDetailModal />
      <FilterModal />
    </>
  )
}