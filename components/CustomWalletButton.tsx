'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';

// Simple fun function to generate a neon gradient for an avatar based on wallet address
function generateAvatarGradient(address: string) {
  if (!address) return 'linear-gradient(135deg, #333355, #12122A)';
  const colors = [
    '#00F5FF', '#FF00FF', '#00FF88', '#FFD700', '#FF3366', '#AA00FF', '#00C3FF'
  ];
  
  // Use char codes to pick two colors deterministically
  const sum1 = address.charCodeAt(0) + address.charCodeAt(address.length - 1);
  const sum2 = address.charCodeAt(1) + address.charCodeAt(address.length - 2);
  
  const color1 = colors[sum1 % colors.length];
  const color2 = colors[sum2 % colors.length];
  
  return `linear-gradient(135deg, ${color1}, ${color2})`;
}

function shortenAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export default function CustomWalletButton() {
  const { wallet, publicKey, disconnect, connecting, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [copied, setCopied] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopy = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!connected || !publicKey) {
    return (
      <button 
        className="btn btn-primary" 
        onClick={() => setVisible(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 20px',
          fontSize: '14px',
          fontWeight: 700,
          whiteSpace: 'nowrap'
        }}
      >
        {connecting ? (
          <>
            <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></span>
            Connecting...
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>
            </svg>
            Connect Wallet
          </>
        )}
      </button>
    );
  }

  const base58 = publicKey.toBase58();
  const avatarGrad = generateAvatarGradient(base58);

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Connected Button */}
      <button 
        onClick={() => setDropdownOpen(!dropdownOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(18, 18, 42, 0.8)',
          border: '1px solid rgba(0, 245, 255, 0.3)',
          borderRadius: '99px',
          padding: '6px 16px 6px 6px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: dropdownOpen ? '0 0 15px rgba(0, 245, 255, 0.2)' : 'none',
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(0, 245, 255, 0.6)'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = dropdownOpen ? 'rgba(0, 245, 255, 0.6)' : 'rgba(0, 245, 255, 0.3)'}
      >
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: avatarGrad,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.2)',
          position: 'relative',
        }}>
          {wallet?.adapter.icon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={wallet.adapter.icon} 
              alt={wallet.adapter.name} 
              style={{
                width: '14px',
                height: '14px',
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                background: '#12122A',
                borderRadius: '50%',
                padding: '1px'
              }}
            />
          )}
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start'
        }}>
          <span style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: '12px',
            fontWeight: 700,
            color: '#FFFFFF',
            lineHeight: 1
          }}>
            {shortenAddress(base58)}
          </span>
          <span style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '9px',
            color: '#00FF88',
            fontWeight: 600,
            letterSpacing: '0.05em'
          }}>
            CONNECTED
          </span>
        </div>
        <svg 
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8888BB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ 
            transform: dropdownOpen ? 'rotate(180deg)' : 'none', 
            transition: 'transform 0.2s',
            marginLeft: '4px' 
          }}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 12px)',
          right: 0,
          width: '260px',
          background: 'rgba(18, 18, 42, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          animation: 'slideInDown 0.2s ease-out',
          zIndex: 1000,
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
            paddingBottom: '16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: avatarGrad,
              boxShadow: '0 0 15px rgba(0,245,255,0.2)'
            }} />
            <div>
              <div style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: '14px',
                fontWeight: 700,
                color: '#fff'
              }}>
                {shortenAddress(base58)}
              </div>
              <button 
                onClick={handleCopy}
                style={{
                  background: 'none',
                  border: 'none',
                  color: copied ? '#00FF88' : '#8888BB',
                  fontSize: '11px',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  cursor: 'pointer',
                  padding: 0,
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {copied ? '✓ Copied!' : '📋 Copy Address'}
              </button>
            </div>
          </div>

          {/* Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Link 
              href="/profile" 
              onClick={() => setDropdownOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                color: '#FFFFFF',
                textDecoration: 'none',
                borderRadius: '8px',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '14px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              👤 My Profile
            </Link>
            <Link 
              href="/shop" 
              onClick={() => setDropdownOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                color: '#FFFFFF',
                textDecoration: 'none',
                borderRadius: '8px',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '14px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              🎟 Buy Tickets
            </Link>
          </div>

          {/* Disconnect */}
          <button 
            onClick={() => {
              disconnect();
              setDropdownOpen(false);
            }}
            style={{
              width: '100%',
              marginTop: '16px',
              padding: '10px',
              background: 'rgba(255, 51, 102, 0.1)',
              border: '1px solid rgba(255, 51, 102, 0.2)',
              borderRadius: '8px',
              color: '#FF3366',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 51, 102, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 51, 102, 0.1)';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
