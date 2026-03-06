/**
 * Design system – Botão do Pânico (mobile)
 * Cores, espaçamento, tipografia e sombras consistentes.
 */
export const colors = {
  primary: '#005BBB',
  text: '#000000',
  background: '#FFFFFF',
  link: '#007ACC',
  gray: '#666666',
  border: '#e0e0e0',
  error: '#c53030',
  success: '#2e7d32',
  panic: '#dc2626',
  onPrimary: '#FFFFFF',
  /** Fundo suave para cards secundários / empty states */
  cardBg: '#f8f9fa',
  /** Bordas de inputs em foco (opcional) */
  inputBorderFocus: '#005BBB',
} as const;

/** Espaçamento base 4px */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

/** Raios de borda */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
} as const;

/** Tipografia */
export const typography = {
  title: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
  titleSmall: { fontSize: 20, fontWeight: '700' as const, lineHeight: 28 },
  section: { fontSize: 17, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  label: { fontSize: 14, fontWeight: '500' as const, lineHeight: 20 },
  button: { fontSize: 16, fontWeight: '600' as const },
} as const;

/** Sombras (iOS shadow + Android elevation) */
export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
} as const;

/** Estilo de card padrão (fundo branco, borda, bordas arredondadas, sombra) */
export const cardStyle = {
  backgroundColor: colors.background,
  borderRadius: radius.md,
  padding: spacing.md,
  borderWidth: 1,
  borderColor: colors.border,
  ...shadows.card,
};

/** Estilo de input padrão */
export const inputStyle = {
  backgroundColor: colors.background,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: radius.sm,
  paddingVertical: 14,
  paddingHorizontal: 16,
  fontSize: 16,
  color: colors.text,
};

/** Estilo de botão primário */
export const primaryButtonStyle = {
  backgroundColor: colors.primary,
  paddingVertical: 16,
  paddingHorizontal: 24,
  borderRadius: radius.sm,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  ...shadows.button,
};

/** Badge de status (pill) */
export const statusBadge = (isOpen: boolean) => ({
  paddingVertical: 6,
  paddingHorizontal: 12,
  borderRadius: radius.full,
  alignSelf: 'flex-start' as const,
  backgroundColor: isOpen ? 'rgba(197,48,48,0.12)' : 'rgba(46,125,50,0.12)',
});
