"use client";

import React from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { useFinance } from "@/hooks/useFinance";
import { apiService } from "@/services/api";

export default function ConfiguracoesPage() {
  const { state, dispatch } = useFinance();
  const { settings } = state;
  const [newCategory, setNewCategory] = React.useState("");
  const [showResetConfirm, setShowResetConfirm] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [whatsappToken, setWhatsappToken] = React.useState<string | null>(null);
  const [whatsappLoading, setWhatsappLoading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleConnectWhatsApp = async () => {
    setWhatsappLoading(true);
    try {
      const { token } = await apiService.preRegister();
      setWhatsappToken(token);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao gerar token";
      alert(message);
    } finally {
      setWhatsappLoading(false);
    }
  };

  const openWhatsApp = () => {
    if (!whatsappToken) return;
    const phoneNumber = "5527928341723";
    const message = `Activation code: ${whatsappToken}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, "_blank");
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      dispatch({ type: "UPDATE_SETTINGS", payload: { avatar: reader.result as string } });
    };
    reader.readAsDataURL(file);
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    if (settings.customCategories.includes(newCategory.trim())) return;
    dispatch({
      type: "UPDATE_SETTINGS",
      payload: { customCategories: [...settings.customCategories, newCategory.trim()] },
    });
    setNewCategory("");
  };

  const handleRemoveCategory = (cat: string) => {
    dispatch({
      type: "UPDATE_SETTINGS",
      payload: {
        customCategories: settings.customCategories.filter((c) => c !== cat),
      },
    });
  };

  const handleResetData = () => {
    dispatch({ type: "RESET_DATA" });
    setShowResetConfirm(false);
  };

  const allCategories = [
    "Alimentação", "Transporte", "Moradia", "Entretenimento",
    "Saúde", "Compras", "Renda", "Renda Extra", "Educação", "Outros",
    ...settings.customCategories,
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Configurações"
        subtitle="Configure as preferências do sistema"
      />

      {/* Perfil */}
      <div className="bg-white rounded-3xl p-6 ring-shadow">
        <h3 className="font-display font-bold text-lg text-near-black mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined">person</span>
          Perfil
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray uppercase tracking-wider mb-1.5 block">Avatar</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-light-surface flex items-center justify-center overflow-hidden">
                {settings.avatar ? (
                  <img src={settings.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-3xl text-gray">person</span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-full bg-wise-green text-dark-green text-sm font-semibold btn-scale"
              >
                Alterar avatar
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray uppercase tracking-wider mb-1.5 block">Nome</label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={settings.name}
                onChange={(e) => dispatch({ type: "UPDATE_SETTINGS", payload: { name: e.target.value } })}
                className="flex-1 px-4 py-3 rounded-xl bg-light-surface border border-transparent focus:border-wise-green focus:outline-none text-sm font-medium text-near-black"
              />
              <button
                onClick={() => dispatch({ type: "UPDATE_SETTINGS", payload: { name: settings.name } })}
                className="px-5 py-3 rounded-full bg-wise-green text-dark-green font-semibold text-sm btn-scale"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conectar WhatsApp */}
      <div className="bg-white rounded-3xl p-6 ring-shadow border border-wise-green/20">
        <h3 className="font-display font-bold text-lg text-near-black mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-wise-green">chat</span>
          Conectar WhatsApp
        </h3>
        <p className="text-sm text-gray mb-4">
          Gere um código de ativação para conectar seu WhatsApp ao Bagcoin. 
          O código é válido por 7 dias. Envie-o para o nosso número de atendimento.
        </p>

        {!whatsappToken ? (
          <button
            onClick={handleConnectWhatsApp}
            disabled={whatsappLoading}
            className="px-5 py-3 rounded-full bg-wise-green text-dark-green font-semibold text-sm btn-scale disabled:opacity-50 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">chat</span>
            {whatsappLoading ? "Gerando código..." : "Gerar código de ativação"}
          </button>
        ) : (
          <div className="space-y-4">
            <div className="bg-light-surface rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray uppercase tracking-wider mb-1">Seu código de ativação</p>
                <p className="font-mono text-lg font-bold text-near-black tracking-widest">{whatsappToken}</p>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(whatsappToken)}
                className="px-4 py-2 rounded-full bg-white border border-near-black/10 text-near-black text-sm font-semibold btn-scale"
              >
                Copiar
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={openWhatsApp}
                className="px-5 py-3 rounded-full bg-wise-green text-dark-green font-semibold text-sm btn-scale flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">open_in_new</span>
                Abrir WhatsApp
              </button>
              <button
                onClick={() => setWhatsappToken(null)}
                className="px-5 py-3 rounded-full bg-light-surface text-near-black font-semibold text-sm btn-scale"
              >
                Gerar novo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Minhas Categorias */}
      <div className="bg-white rounded-3xl p-6 ring-shadow">
        <h3 className="font-display font-bold text-lg text-near-black mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined">label</span>
          Minhas Categorias
        </h3>
        <p className="text-sm text-gray mb-4">
          {settings.customCategories.length === 0
            ? "Nenhuma categoria personalizada. Crie uma para usar em transações e orçamentos."
            : `${settings.customCategories.length} categoria(s) personalizada(s)`}
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {allCategories.map((cat) => (
            <span
              key={cat}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold ${
                settings.customCategories.includes(cat)
                  ? "bg-wise-green/15 text-dark-green"
                  : "bg-light-surface text-gray"
              }`}
            >
              {cat}
              {settings.customCategories.includes(cat) && (
                <button
                  onClick={() => handleRemoveCategory(cat)}
                  className="ml-1 hover:text-danger-red"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Nova categoria..."
            className="flex-1 px-4 py-3 rounded-xl bg-light-surface border border-transparent focus:border-wise-green focus:outline-none text-sm font-medium text-near-black"
            onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
          />
          <button
            onClick={handleAddCategory}
            className="px-5 py-3 rounded-full bg-wise-green text-dark-green font-semibold text-sm btn-scale"
          >
            Adicionar
          </button>
        </div>
      </div>

      {/* Moeda Base */}
      <div className="bg-white rounded-3xl p-6 ring-shadow">
        <h3 className="font-display font-bold text-lg text-near-black mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined">attach_money</span>
          Moeda Base
        </h3>
        <select
          value={settings.currency}
          onChange={(e) => dispatch({ type: "UPDATE_SETTINGS", payload: { currency: e.target.value } })}
          className="w-full px-4 py-3 rounded-xl bg-light-surface border border-transparent focus:border-wise-green focus:outline-none text-sm font-medium text-near-black"
        >
          <option value="BRL">R$ — Real Brasileiro (BRL)</option>
          <option value="USD">$ — Dólar Americano (USD)</option>
          <option value="EUR">€ — Euro (EUR)</option>
        </select>
        <p className="text-xs text-gray mt-2">Moeda Base: <span className="font-semibold">{settings.currency === "BRL" ? "R$ Real Brasileiro" : settings.currency}</span></p>
      </div>

      {/* Idioma */}
      <div className="bg-white rounded-3xl p-6 ring-shadow">
        <h3 className="font-display font-bold text-lg text-near-black mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined">translate</span>
          Idioma
        </h3>
        <select
          value={settings.language}
          onChange={(e) => dispatch({ type: "UPDATE_SETTINGS", payload: { language: e.target.value } })}
          className="w-full px-4 py-3 rounded-xl bg-light-surface border border-transparent focus:border-wise-green focus:outline-none text-sm font-medium text-near-black"
        >
          <option value="pt-BR">Português (Brasil)</option>
          <option value="en-US">English (United States)</option>
          <option value="es-ES">Español (España)</option>
        </select>
      </div>

      {/* País */}
      <div className="bg-white rounded-3xl p-6 ring-shadow">
        <h3 className="font-display font-bold text-lg text-near-black mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined">public</span>
          País
        </h3>
        <select
          value={settings.country}
          onChange={(e) => dispatch({ type: "UPDATE_SETTINGS", payload: { country: e.target.value } })}
          className="w-full px-4 py-3 rounded-xl bg-light-surface border border-transparent focus:border-wise-green focus:outline-none text-sm font-medium text-near-black"
        >
          <option value="Brasil">Brasil</option>
          <option value="Portugal">Portugal</option>
          <option value="Estados Unidos">Estados Unidos</option>
          <option value="Espanha">Espanha</option>
        </select>
      </div>

      {/* Resetar Dados */}
      <div className="bg-white rounded-3xl p-6 ring-shadow border border-warning-yellow/30">
        <h3 className="font-display font-bold text-lg text-near-black mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-warning-yellow">restart_alt</span>
          Resetar Conta
        </h3>
        <p className="text-sm text-gray mb-4">
          Esta ação irá deletar todos os seus dados e resetar o onboarding. Você começará do zero, como se tivesse acabado de criar a conta.
        </p>
        <button
          onClick={() => setShowResetConfirm(true)}
          className="px-5 py-3 rounded-full bg-warning-yellow text-near-black font-semibold text-sm btn-scale"
        >
          Resetar Conta
        </button>
      </div>

      {/* Deletar Conta */}
      <div className="bg-white rounded-3xl p-6 ring-shadow border border-danger-red/30">
        <h3 className="font-display font-bold text-lg text-near-black mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-danger-red">delete_forever</span>
          Deletar Conta do Usuário
        </h3>
        <p className="text-sm text-gray mb-4">
          Esta ação é permanente e não pode ser desfeita. Todos os seus dados, incluindo transações, contas bancárias, orçamentos e metas serão permanentemente excluídos.
        </p>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="px-5 py-3 rounded-full bg-danger-red text-white font-semibold text-sm btn-scale"
        >
          Excluir
        </button>
      </div>

      {/* Informações do App */}
      <div className="bg-white rounded-3xl p-6 ring-shadow">
        <h3 className="font-display font-bold text-lg text-near-black mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined">info</span>
          Informações do App
        </h3>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray">Versão:</span>
          <span className="font-semibold text-near-black">v0.1.0-beta</span>
        </div>
      </div>

      {/* Reset Confirm Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-transparent" onClick={() => setShowResetConfirm(false)} />
          <div className="relative bg-white rounded-[30px] p-6 w-full max-w-sm shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto my-auto">
            <h3 className="font-display font-bold text-xl text-near-black mb-3">Resetar Conta?</h3>
            <p className="text-sm text-gray mb-6">
              Todos os dados serão apagados e você começará do zero. Suas configurações de perfil serão mantidas.
            </p>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-3 rounded-full bg-light-surface text-near-black font-semibold text-sm btn-scale">
                Cancelar
              </button>
              <button onClick={handleResetData} className="flex-1 py-3 rounded-full bg-warning-yellow text-near-black font-semibold text-sm btn-scale">
                Confirmar Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-transparent" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white rounded-[30px] p-6 w-full max-w-sm shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto my-auto">
            <h3 className="font-display font-bold text-xl text-near-black mb-3">Tem certeza?</h3>
            <p className="text-sm text-gray mb-6">
              Esta ação é permanente. Todos os dados serão excluídos permanentemente.
            </p>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 rounded-full bg-light-surface text-near-black font-semibold text-sm btn-scale">
                Cancelar
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem("bagcoin_state");
                  window.location.reload();
                }}
                className="flex-1 py-3 rounded-full bg-danger-red text-white font-semibold text-sm btn-scale"
              >
                Excluir Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
