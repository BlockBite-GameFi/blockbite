'use client';

import Link from 'next/link';
import { SmoothScrollLink } from './SmoothScrollLink';

export function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-wrap lp-footer-inner">
        <div className="lp-footer-brand">
          <img src="/logo.png" alt="BlockBite" className="lp-footer-logo" />
          <div>
            <span className="lp-footer-name">BlockBite</span>
            <p className="lp-footer-desc">
              Solana-native token vesting and distribution. Fair, automatic, and cheap.
            </p>
          </div>
        </div>

        <div className="lp-footer-links">
          <div className="lp-footer-col">
            <h4>Product</h4>
            <SmoothScrollLink href="#product">Features</SmoothScrollLink>
            <SmoothScrollLink href="#how">How it works</SmoothScrollLink>
            <SmoothScrollLink href="#demo">Demo</SmoothScrollLink>
          </div>
          <div className="lp-footer-col">
            <h4>Resources</h4>
            <a href="https://github.com/BlockBite-GameFi/blockbite-smart-contract" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <Link href="/new">Open app</Link>
            <Link href="/protocol">Protocol</Link>
          </div>
          <div className="lp-footer-col">
            <h4>Get Started</h4>
            <SmoothScrollLink href="#faq">FAQ</SmoothScrollLink>
            <SmoothScrollLink href="#waitlist">Waitlist</SmoothScrollLink>
            <a href="https://x.com/BlockBite_Sol" target="_blank" rel="noopener noreferrer">
              Twitter / X
            </a>
          </div>
        </div>
      </div>

      <div className="lp-footer-bottom">
        <p>&copy; 2026 BlockBite &middot; Token Distribution Protocol on Solana</p>
      </div>
    </footer>
  );
}
