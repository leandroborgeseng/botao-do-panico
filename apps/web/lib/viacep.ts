export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export async function fetchAddressByCep(cep: string): Promise<ViaCepResponse> {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) throw new Error('CEP deve ter 8 dígitos.');
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    const data: ViaCepResponse = await res.json();
    if (data?.erro) throw new Error('CEP não encontrado.');
    if (!data?.localidade) throw new Error('CEP não encontrado.');
    return data;
  } catch (e) {
    if (e instanceof Error && (e.message === 'CEP não encontrado.' || e.message === 'CEP deve ter 8 dígitos.')) throw e;
    throw new Error('Erro ao buscar endereço. Verifique sua conexão.');
  }
}
