'use client';

import { useState } from 'react';

import { Button, Box, Typography } from '@mui/material';

export default function PaymentSuccess({ text = "" }) {
    const [showBlast, setShowBlast] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [blastParticles, setBlastParticles] = useState([]);

    const handleClick = () => {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;

        // Huge dense blast: 300 particles
        const particles = Array.from({ length: 300 }).map(() => {
            const angle = Math.random() * Math.PI * 2;
            const distance = 400 + Math.random() * 600; // more spread
            const palette = [50, 0, 30, 200, 280, 120];

            return {
                left: cx,
                top: cy,
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                hue: palette[Math.floor(Math.random() * palette.length)],
                size: 8 + Math.random() * 12, // bigger particles
                duration: 3500 + Math.random() * 1000, // slight variation in speed
                id: Math.random().toString(36).substr(2, 9),
            };
        });

        setBlastParticles(particles);
        setShowBlast(true);

        // Show success after blast
        setTimeout(() => {
            setBlastParticles([]);
            setShowBlast(false);
            setShowSuccess(true);
        }, 1500); // slightly longer for big blast
    };

    return (
        <>
            {!showBlast && !showSuccess && (
                <Button
                    variant="contained"
                    color="success"
                    onClick={handleClick}
                    sx={{
                        borderRadius: 999,
                        px: 4,
                        py: 1.8,
                        fontSize: 18,
                        boxShadow: '0 12px 30px rgba(34,197,94,.35)',
                    }}
                >
                    Pay Now
                </Button>
            )}

            {/* BLAST PARTICLES */}
            {showBlast &&
                blastParticles.map(p => (
                    <div
                        key={p.id}
                        className="particle"
                        style={{
                            left: p.left,
                            top: p.top,
                            '--x': `${p.x}px`,
                            '--y': `${p.y}px`,
                            '--hue': p.hue,
                            '--size': `${p.size}px`,
                            '--duration': `${p.duration}ms`,
                        }}
                    />
                ))}

            {/* SUCCESS MESSAGE */}
            {showSuccess && (
                <Box
                    sx={{
                        position: 'fixed',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2,
                        animation: 'fadeIn .6s ease-out forwards',
                    }}
                >
                    <Box
                        sx={{
                            inlineSize: 96,
                            blockSize: 96,
                            bgcolor: '#22c55e',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 20px 50px rgba(34,197,94,.45)',
                            animation: 'pop .5s ease-out',
                        }}
                    >
                        <Box
                            sx={{
                                inlineSize: 38,
                                blockSize: 20,
                                borderLeft: '6px solid white',
                                borderBottom: '6px solid white',
                                transform: 'rotate(-45deg)',
                            }}
                        />
                    </Box>

                    <Typography sx={{ fontSize: 18, fontWeight: 500, color: '#16a34a' }}>
                        {text || 'Payment Successful!'}
                    </Typography>
                </Box>
            )}

            {/* Global styles */}
            <style jsx global>{`
        body {
          background: #fff);
          overflow: hidden;
        }
        .particle {
          position: absolute;
          width: var(--size);
          height: var(--size);
          border-radius: 50%;
          pointer-events: none;
          background: radial-gradient(circle, hsl(var(--hue), 100%, 70%), transparent);
          animation: blast var(--duration) linear forwards;
        }
        @keyframes blast {
          from {
            transform: translate(0,0) scale(1);
            opacity: 1;
          }
          to {
            transform: translate(var(--x), var(--y)) scale(0.1);
            opacity: 0;
          }
        }
        @keyframes pop {
          from { transform: scale(0.6); }
          to { transform: scale(1); }
        }
        @keyframes fadeIn { to { opacity: 1; } }
      `}</style>
        </>
    );
}
