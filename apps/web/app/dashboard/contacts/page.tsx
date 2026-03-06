'use client';

import { useEffect, useState } from 'react';
import { contacts, type EmergencyContact } from '@/lib/api';

export default function ContactsPage() {
  const [list, setList] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState<EmergencyContact | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({ cpf: '', name: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');

  function formatCpfDisplay(value: string) {
    const d = value.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
  }

  function formatPhoneDisplay(value: string) {
    const d = value.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }

  function load() {
    contacts
      .list()
      .then(setList)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setShowCreateForm(true);
    setSuccess('');
    setLookupError('');
    setForm({ cpf: '', name: '', phone: '', email: '' });
  }

  async function handleLookupByCpf() {
    const digits = form.cpf.replace(/\D/g, '');
    if (digits.length !== 11) {
      setLookupError('Informe um CPF com 11 dígitos.');
      return;
    }
    setLookupError('');
    setLookupLoading(true);
    try {
      const user = await contacts.lookupByCpf(digits);
      if (user) {
        setForm((f) => ({ ...f, name: user.name }));
      } else {
        setLookupError('Nenhum usuário encontrado com este CPF. A pessoa precisa estar cadastrada no app.');
      }
    } catch {
      setLookupError('Erro ao buscar. Tente novamente.');
    } finally {
      setLookupLoading(false);
    }
  }

  function openEdit(c: EmergencyContact) {
    setEditing(c);
    setShowCreateForm(false);
    setForm({ cpf: c.cpf ?? '', name: c.name, phone: c.phone, email: c.email });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      if (editing) {
        await contacts.update(editing.id, { name: form.name, phone: form.phone, email: form.email });
        setSuccess('Contato atualizado com sucesso.');
      } else {
        if (list.length >= 3) {
          setError('Máximo de 3 contatos permitidos.');
          setSaving(false);
          return;
        }
        if (!form.cpf.trim()) {
          setError('CPF é obrigatório. A pessoa precisa estar cadastrada no app.');
          setSaving(false);
          return;
        }
        await contacts.create({
          cpf: form.cpf.replace(/\D/g, ''),
          name: form.name || undefined,
          phone: form.phone || undefined,
          email: form.email || undefined,
        });
        setSuccess('Contato criado com sucesso.');
      }
      setEditing(null);
      setShowCreateForm(false);
      setForm({ cpf: '', name: '', phone: '', email: '' });
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover este contato?')) return;
    try {
      await contacts.delete(id);
      setSuccess('Contato removido com sucesso.');
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro');
    }
  }

  if (loading) return <p style={{ color: 'var(--color-text)' }}>Carregando contatos...</p>;

  const inputStyle = {
    display: 'block' as const,
    width: '100%',
    maxWidth: 320,
    marginTop: 4,
    padding: 10,
    background: 'var(--color-background)',
    border: '1px solid var(--color-border)',
    borderRadius: 8,
    color: 'var(--color-text)',
  };

  return (
    <div>
      <h1 style={{ marginBottom: 8, color: 'var(--color-primary)' }}>Meus contatos</h1>
      <p style={{ color: 'var(--color-gray)', marginBottom: 24 }}>
        Até 3 contatos de emergência (recebem push quando você acionar o pânico).
      </p>
      {error && (
        <p style={{ color: 'var(--color-error)', marginBottom: 16 }}>{error}</p>
      )}
      {success && (
        <p style={{ color: 'var(--color-success)', marginBottom: 16 }}>{success}</p>
      )}
      {list.length < 3 && !editing && !showCreateForm && (
        <button
          onClick={openCreate}
          style={{
            marginBottom: 24,
            padding: '10px 20px',
            background: 'var(--color-primary)',
            border: 'none',
            borderRadius: 8,
            color: 'white',
          }}
        >
          Adicionar contato
        </button>
      )}
      {(editing || showCreateForm || form.cpf || form.name || form.phone || form.email) && (
        <form
          onSubmit={handleSubmit}
          style={{
            background: 'var(--color-background)',
            padding: 24,
            borderRadius: 12,
            marginBottom: 24,
            border: '1px solid var(--color-border)',
          }}
        >
          <h2 style={{ marginBottom: 16, color: 'var(--color-text)' }}>{editing ? 'Editar' : 'Novo'} contato</h2>
          {!editing && (
            <>
              <label style={{ display: 'block', marginBottom: 12, color: 'var(--color-text)' }}>
                CPF do contato (precisa estar cadastrado no app)
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <input
                    value={form.cpf}
                    onChange={(e) => setForm((f) => ({ ...f, cpf: formatCpfDisplay(e.target.value) }))}
                    placeholder="000.000.000-00"
                    style={{ ...inputStyle, flex: '1 1 200px' }}
                  />
                  <button
                    type="button"
                    onClick={handleLookupByCpf}
                    disabled={lookupLoading || form.cpf.replace(/\D/g, '').length !== 11}
                    style={{
                      padding: '10px 16px',
                      background: 'var(--color-link)',
                      border: 'none',
                      borderRadius: 8,
                      color: 'white',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {lookupLoading ? 'Buscando...' : 'Buscar e preencher'}
                  </button>
                </div>
              </label>
              {lookupError && (
                <p style={{ color: 'var(--color-error)', fontSize: 14, marginBottom: 12 }}>{lookupError}</p>
              )}
              <p style={{ fontSize: 13, color: 'var(--color-gray)', marginBottom: 12 }}>
                Ao clicar em &quot;Buscar e preencher&quot;, nome e e-mail do cadastro serão preenchidos automaticamente.
              </p>
            </>
          )}
          <label style={{ display: 'block', marginBottom: 12, color: 'var(--color-text)' }}>
            Nome
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required style={inputStyle} />
          </label>
          <label style={{ display: 'block', marginBottom: 12, color: 'var(--color-text)' }}>
            Telefone
            <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: formatPhoneDisplay(e.target.value) }))} required style={inputStyle} />
          </label>
          <label style={{ display: 'block', marginBottom: 16, color: 'var(--color-text)' }}>
            E-mail
            <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required style={inputStyle} />
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="submit"
              disabled={saving}
              style={{ padding: '10px 20px', background: 'var(--color-primary)', border: 'none', borderRadius: 8, color: 'white' }}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              type="button"
              onClick={() => { setEditing(null); setShowCreateForm(false); setForm({ cpf: '', name: '', phone: '', email: '' }); }}
              style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-link)' }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
      {list.length === 0 && !loading && (
        <p style={{ color: 'var(--color-gray)', padding: 24, textAlign: 'center' }}>Você ainda não tem contatos. Use o botão acima para adicionar.</p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {list.map((c) => (
          <div
            key={c.id}
            style={{
              background: 'var(--color-background)',
              padding: 16,
              borderRadius: 12,
              border: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <strong style={{ color: 'var(--color-text)' }}>{c.name}</strong>
              <p style={{ fontSize: 14, color: 'var(--color-gray)' }}>{c.phone} — {c.email}</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => openEdit(c)}
                style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-link)' }}
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(c.id)}
                style={{ padding: '8px 16px', background: 'rgba(197,48,48,0.15)', border: 'none', borderRadius: 8, color: 'var(--color-error)' }}
              >
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
