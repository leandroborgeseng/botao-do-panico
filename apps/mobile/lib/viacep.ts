const VIA_CEP = 'https://viacep.com.br/ws';

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export async function fetchAddressByCep(cep: string): Promise<ViaCepResponse | null> {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) return null;
  try {
    const res = await fetch(`${VIA_CEP}/${digits}/json/`);
    const data: ViaCepResponse = await res.json();
    if (data?.erro) return null;
    if (!data?.localidade) return null;
    return data;
  } catch {
    throw new Error('Erro ao buscar CEP. Verifique sua conexão.');
  }
}

export function formatCpfDisplay(value: string): string {
  const d = value.replace(/\D/g, '');
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

export function formatCepDisplay(value: string): string {
  const d = value.replace(/\D/g, '');
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5, 8)}`;
}
