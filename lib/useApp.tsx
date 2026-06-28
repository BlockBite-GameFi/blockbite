'use client';
import { createContext, useContext, ReactNode } from 'react';

const DICT: Record<string, string> = {
  nav_product:       'PRODUCT',
  nav_how_it_works:  'HOW IT WORKS',
  nav_token_streams: 'TOKEN STREAMS',
  nav_my_campaign:   'MY CAMPAIGN',
  nav_faq:           'FAQ',
  nav_demo:          'DEMO',
  nav_back:          '← Home',
  cta_launch:        'Launch App',
  join_waitlist:     'Join Waitlist',
  waitlist_note:     'No spam. Unsubscribe anytime.',
  waitlist_success:  "You're on the list! We'll notify you when BlockBite launches.",
};

type AppCtx = {
  t: (k: string) => string;
};

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <Ctx.Provider value={{ t: (k) => DICT[k] ?? k }}>
      {children}
    </Ctx.Provider>
  );
}

export const useApp = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp must be inside AppProvider');
  return c;
};
