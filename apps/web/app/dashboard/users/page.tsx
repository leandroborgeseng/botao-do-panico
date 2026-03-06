'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { users, type User } from '@/lib/api';
import { fetchAddressByCep } from '@/lib/viacep';

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  cpf: '',
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
};

const initialEditForm = {
  name: '',
  email: '',
  cpf: '',
  password: '',
  role: 'USER' as 'USER' | 'ADMIN',
  active: true,
  supportOnly: false,
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
};

export default function UsersPage() {
  const router = useRouter();
  const [list, setList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState(initialEditForm);
  const [editSaving, setEditSaving] = useState(false);
  const [editLoadingCep, setEditLoadingCep] = useState(false);

  function formatCpfDisplay(value: string) {
    const d = value.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
  }

  function load() {
    users.list().then(setList).catch((e) => setError(e.message));
  }

  useEffect(() => {
    const u = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    const user = u ? (JSON.parse(u) as { role?: string }) : null;
    if (user?.role !== 'ADMIN') {
      router.replace('/dashboard');
      return;
    }
    users
      .list()
      .then(setList)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleCepBlur() {
    const digits = form.cep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    setLoadingCep(true);
    setError('');
    try {
      const data = await fetchAddressByCep(form.cep);
      setForm((f) => ({
        ...f,
        street: data.logradouro || f.street,
        neighborhood: data.bairro || f.neighborhood,
        city: data.localidade || f.city,
        state: data.uf || f.state,
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao buscar CEP.');
    } finally {
      setLoadingCep(false);
    }
  }

  function handleCepChange(value: string) {
    const d = value.replace(/\D/g, '').slice(0, 8);
    setForm((f) => ({ ...f, cep: d.length <= 5 ? d : `${d.slice(0, 5)}-${d.slice(5)}` }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
    if (!fullName) {
      setError('Informe nome e sobrenome.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await users.create({
        name: fullName,
        email: form.email,
        password: form.password,
        cpf: form.cpf.replace(/\D/g, '') || undefined,
        cep: form.cep || undefined,
        street: form.street || undefined,
        number: form.number || undefined,
        complement: form.complement || undefined,
        neighborhood: form.neighborhood || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
      });
      setForm(initialForm);
      setShowForm(false);
      setSuccess('Usuário criado com sucesso.');
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este usuário? Esta ação não pode ser desfeita.')) return;
    try {
      await users.delete(id);
      setList((prev) => prev.filter((u) => u.id !== id));
      setSuccess('Usuário excluído com sucesso.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro');
    }
  }

  async function openEdit(u: User) {
    setError('');
    setEditingUser(u);
    setEditForm(initialEditForm);
    try {
      const full = await users.get(u.id);
      setEditingUser(full);
      setEditForm({
        name: full.name || '',
        email: full.email || '',
        cpf: full.cpf ?? '',
        password: '',
        role: (full.role === 'ADMIN' ? 'ADMIN' : 'USER') as 'USER' | 'ADMIN',
        active: full.active !== false,
        supportOnly: full.supportOnly === true,
        cep: full.cep ?? '',
        street: full.street ?? '',
        number: full.number ?? '',
        complement: full.complement ?? '',
        neighborhood: full.neighborhood ?? '',
        city: full.city ?? '',
        state: full.state ?? '',
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar usuário');
      setEditingUser(null);
    }
  }

  async function handleEditCepBlur() {
    const digits = editForm.cep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    setEditLoadingCep(true);
    setError('');
    try {
      const data = await fetchAddressByCep(editForm.cep);
      setEditForm((f) => ({
        ...f,
        street: data.logradouro || f.street,
        neighborhood: data.bairro || f.neighborhood,
        city: data.localidade || f.city,
        state: data.uf || f.state,
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao buscar CEP.');
    } finally {
      setEditLoadingCep(false);
    }
  }

  function handleEditCepChange(value: string) {
    const d = value.replace(/\D/g, '').slice(0, 8);
    setEditForm((f) => ({ ...f, cep: d.length <= 5 ? d : `${d.slice(0, 5)}-${d.slice(5)}` }));
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setEditSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload: Parameters<typeof users.update>[1] = {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        role: editForm.role,
        active: editForm.active,
        supportOnly: editForm.supportOnly,
        ...(editForm.cpf.trim() && { cpf: editForm.cpf.replace(/\D/g, '') }),
        cep: editForm.cep || undefined,
        street: editForm.street || undefined,
        number: editForm.number || undefined,
        complement: editForm.complement || undefined,
        neighborhood: editForm.neighborhood || undefined,
        city: editForm.city || undefined,
        state: editForm.state || undefined,
      };
      if (editForm.password) payload.password = editForm.password;
      await users.update(editingUser.id, payload);
      setError('');
      setEditingUser(null);
      setSuccess('Usuário atualizado com sucesso.');
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setEditSaving(false);
    }
  }

  if (loading) return <p style={{ color: 'var(--color-text)' }}>Carregando usuários...</p>;

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
      <h1 style={{ marginBottom: 24, color: 'var(--color-primary)' }}>Usuários</h1>
      {error && (
        <p style={{ color: 'var(--color-error)', marginBottom: 16, padding: 12, background: 'rgba(197,48,48,0.1)', borderRadius: 8 }}>
          {error}
        </p>
      )}
      {success && (
        <p style={{ color: 'var(--color-success)', marginBottom: 16, padding: 12, background: 'rgba(46,125,50,0.12)', borderRadius: 8 }}>
          {success}
        </p>
      )}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          style={{
            marginBottom: 24,
            padding: '10px 20px',
            background: 'var(--color-primary)',
            border: 'none',
            borderRadius: 8,
            color: 'white',
          }}
        >
          Criar usuário
        </button>
      ) : (
        <form
          onSubmit={handleCreate}
          style={{
            background: 'var(--color-background)',
            padding: 24,
            borderRadius: 12,
            marginBottom: 24,
            border: '1px solid var(--color-border)',
            maxWidth: 480,
          }}
        >
          <h2 style={{ marginBottom: 16, color: 'var(--color-text)' }}>Novo usuário</h2>
          <p style={{ fontSize: 13, color: 'var(--color-gray)', marginBottom: 16 }}>
            CPF opcional: se informado, este usuário poderá ser adicionado como contato de emergência por CPF no app.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <label style={{ display: 'block', marginBottom: 12, color: 'var(--color-text)', flex: '1 1 160px' }}>
              Nome
              <input
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                placeholder="Nome"
                required
                style={inputStyle}
              />
            </label>
            <label style={{ display: 'block', marginBottom: 12, color: 'var(--color-text)', flex: '1 1 160px' }}>
              Sobrenome
              <input
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                placeholder="Sobrenome"
                required
                style={inputStyle}
              />
            </label>
          </div>

          <label style={{ display: 'block', marginBottom: 12, color: 'var(--color-text)' }}>
            E-mail
            <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required style={inputStyle} />
          </label>
          <label style={{ display: 'block', marginBottom: 12, color: 'var(--color-text)' }}>
            CPF (opcional)
            <input value={form.cpf} onChange={(e) => setForm((f) => ({ ...f, cpf: formatCpfDisplay(e.target.value) }))} placeholder="000.000.000-00" style={inputStyle} />
          </label>
          <label style={{ display: 'block', marginBottom: 16, color: 'var(--color-text)' }}>
            Senha
            <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required minLength={6} style={inputStyle} />
          </label>

          <h3 style={{ fontSize: 14, color: 'var(--color-primary)', marginBottom: 12, marginTop: 20 }}>Endereço (opcional)</h3>
          <label style={{ display: 'block', marginBottom: 12, color: 'var(--color-text)' }}>
            CEP
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                value={form.cep}
                onChange={(e) => handleCepChange(e.target.value)}
                onBlur={handleCepBlur}
                placeholder="00000-000"
                style={inputStyle}
              />
              {loadingCep && <span style={{ fontSize: 13, color: 'var(--color-gray)' }}>Buscando...</span>}
            </div>
          </label>
          <label style={{ display: 'block', marginBottom: 12, color: 'var(--color-text)' }}>
            Rua
            <input value={form.street} onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))} placeholder="Logradouro" style={inputStyle} />
          </label>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <label style={{ display: 'block', marginBottom: 12, color: 'var(--color-text)', flex: '1 1 80px' }}>
              Número
              <input value={form.number} onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))} placeholder="Nº" style={inputStyle} />
            </label>
            <label style={{ display: 'block', marginBottom: 12, color: 'var(--color-text)', flex: '1 1 120px' }}>
              Complemento
              <input value={form.complement} onChange={(e) => setForm((f) => ({ ...f, complement: e.target.value }))} placeholder="Apto, bloco" style={inputStyle} />
            </label>
          </div>
          <label style={{ display: 'block', marginBottom: 12, color: 'var(--color-text)' }}>
            Bairro
            <input value={form.neighborhood} onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))} placeholder="Bairro" style={inputStyle} />
          </label>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <label style={{ display: 'block', marginBottom: 12, color: 'var(--color-text)', flex: '1 1 160px' }}>
              Cidade
              <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} placeholder="Cidade" style={inputStyle} />
            </label>
            <label style={{ display: 'block', marginBottom: 12, color: 'var(--color-text)', width: 80 }}>
              UF
              <input value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value.toUpperCase().slice(0, 2) }))} placeholder="UF" maxLength={2} style={inputStyle} />
            </label>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
            <button type="submit" disabled={saving} style={{ padding: '10px 20px', background: 'var(--color-primary)', border: 'none', borderRadius: 8, color: 'white' }}>
              {saving ? 'Criando...' : 'Criar'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setForm(initialForm); }} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-link)' }}>
              Cancelar
            </button>
          </div>
        </form>
      )}
      <div style={{ background: 'var(--color-background)', borderRadius: 12, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-primary)', color: 'white' }}>
              <th style={{ textAlign: 'left', padding: 12 }}>Nome</th>
              <th style={{ textAlign: 'left', padding: 12 }}>E-mail</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Função</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Ativo</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Somente suporte</th>
              <th style={{ textAlign: 'left', padding: 12 }}>Criado em</th>
              <th style={{ textAlign: 'left', padding: 12 }}></th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: 'var(--color-gray)' }}>
                  Nenhum usuário cadastrado.
                </td>
              </tr>
            ) : (
            list.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: 12, color: 'var(--color-text)' }}>{u.name}</td>
                <td style={{ padding: 12, color: 'var(--color-text)' }}>{u.email}</td>
                <td style={{ padding: 12 }}>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: 6,
                      background: u.role === 'ADMIN' ? 'rgba(0,91,187,0.2)' : 'rgba(102,102,102,0.2)',
                      color: u.role === 'ADMIN' ? 'var(--color-primary)' : 'var(--color-gray)',
                      fontSize: 12,
                    }}
                  >
                    {u.role}
                  </span>
                </td>
                <td style={{ padding: 12 }}>
                  <span style={{ color: u.active !== false ? 'var(--color-success)' : 'var(--color-error)', fontSize: 13 }}>
                    {u.active !== false ? 'Sim' : 'Não'}
                  </span>
                </td>
                <td style={{ padding: 12 }}>
                  <span style={{ color: u.supportOnly ? 'var(--color-gray)' : 'var(--color-text)', fontSize: 13 }}>
                    {u.supportOnly ? 'Sim' : 'Não'}
                  </span>
                </td>
                <td style={{ padding: 12, color: 'var(--color-text)' }}>
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString('pt-BR') : '-'}
                </td>
                <td style={{ padding: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => openEdit(u)}
                    style={{ padding: '6px 12px', background: 'var(--color-primary)', border: 'none', borderRadius: 6, color: 'white', fontSize: 13 }}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(u.id)}
                    style={{ padding: '6px 12px', background: 'rgba(197,48,48,0.15)', border: 'none', borderRadius: 6, color: 'var(--color-error)', fontSize: 13 }}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))
            )}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: 24,
            overflow: 'auto',
            zIndex: 1000,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) { setError(''); setEditingUser(null); } }}
        >
          <form
            onSubmit={handleEditSubmit}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--color-background)',
              padding: 24,
              borderRadius: 12,
              border: '1px solid var(--color-border)',
              maxWidth: 520,
              width: '100%',
              marginBottom: 24,
            }}
          >
            <h2 style={{ marginBottom: 16, color: 'var(--color-primary)' }}>Editar usuário</h2>
            {error && <p style={{ color: 'var(--color-error)', marginBottom: 12, fontSize: 14 }}>{error}</p>}

            <label style={{ display: 'block', marginBottom: 12, color: 'var(--color-text)' }}>
              Nome
              <input
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                required
                style={inputStyle}
              />
            </label>
            <label style={{ display: 'block', marginBottom: 12, color: 'var(--color-text)' }}>
              E-mail
              <input type="email" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} required style={inputStyle} />
            </label>
            <label style={{ display: 'block', marginBottom: 12, color: 'var(--color-text)' }}>
              CPF
              <input value={editForm.cpf} onChange={(e) => setEditForm((f) => ({ ...f, cpf: formatCpfDisplay(e.target.value) }))} placeholder="000.000.000-00" style={inputStyle} />
            </label>
            <label style={{ display: 'block', marginBottom: 12, color: 'var(--color-text)' }}>
              Nova senha (deixe em branco para não alterar)
              <input type="password" value={editForm.password} onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))} minLength={6} placeholder="Opcional" style={inputStyle} />
            </label>
            <label style={{ display: 'block', marginBottom: 12, color: 'var(--color-text)' }}>
              Função
              <select value={editForm.role} onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value as 'USER' | 'ADMIN' }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="USER">Usuário</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </label>
            <div style={{ display: 'flex', gap: 24, marginBottom: 16, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text)', cursor: 'pointer' }}>
                <input type="checkbox" checked={editForm.active} onChange={(e) => setEditForm((f) => ({ ...f, active: e.target.checked }))} />
                <span>Ativo (pode fazer login)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text)', cursor: 'pointer' }}>
                <input type="checkbox" checked={editForm.supportOnly} onChange={(e) => setEditForm((f) => ({ ...f, supportOnly: e.target.checked }))} />
                <span>Somente suporte (não cadastra contatos de emergência)</span>
              </label>
            </div>

            <h3 style={{ fontSize: 14, color: 'var(--color-primary)', marginBottom: 12, marginTop: 20 }}>Endereço</h3>
            <label style={{ display: 'block', marginBottom: 12, color: 'var(--color-text)' }}>
              CEP
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input value={editForm.cep} onChange={(e) => handleEditCepChange(e.target.value)} onBlur={handleEditCepBlur} placeholder="00000-000" style={inputStyle} />
                {editLoadingCep && <span style={{ fontSize: 13, color: 'var(--color-gray)' }}>Buscando...</span>}
              </div>
            </label>
            <label style={{ display: 'block', marginBottom: 12, color: 'var(--color-text)' }}>
              Rua
              <input value={editForm.street} onChange={(e) => setEditForm((f) => ({ ...f, street: e.target.value }))} style={inputStyle} />
            </label>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <label style={{ display: 'block', marginBottom: 12, color: 'var(--color-text)', flex: '1 1 80px' }}>
                Número
                <input value={editForm.number} onChange={(e) => setEditForm((f) => ({ ...f, number: e.target.value }))} style={inputStyle} />
              </label>
              <label style={{ display: 'block', marginBottom: 12, color: 'var(--color-text)', flex: '1 1 120px' }}>
                Complemento
                <input value={editForm.complement} onChange={(e) => setEditForm((f) => ({ ...f, complement: e.target.value }))} style={inputStyle} />
              </label>
            </div>
            <label style={{ display: 'block', marginBottom: 12, color: 'var(--color-text)' }}>
              Bairro
              <input value={editForm.neighborhood} onChange={(e) => setEditForm((f) => ({ ...f, neighborhood: e.target.value }))} style={inputStyle} />
            </label>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <label style={{ display: 'block', marginBottom: 12, color: 'var(--color-text)', flex: '1 1 160px' }}>
                Cidade
                <input value={editForm.city} onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))} style={inputStyle} />
              </label>
              <label style={{ display: 'block', marginBottom: 12, color: 'var(--color-text)', width: 80 }}>
                UF
                <input value={editForm.state} onChange={(e) => setEditForm((f) => ({ ...f, state: e.target.value.toUpperCase().slice(0, 2) }))} maxLength={2} style={inputStyle} />
              </label>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
              <button type="submit" disabled={editSaving} style={{ padding: '10px 20px', background: 'var(--color-primary)', border: 'none', borderRadius: 8, color: 'white' }}>
                {editSaving ? 'Salvando...' : 'Salvar'}
              </button>
              <button type="button" onClick={() => { setError(''); setEditingUser(null); }} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-link)' }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
