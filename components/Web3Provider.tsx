"use client";

import * as React from "react";
import {
    RainbowKitProvider,
    darkTheme,
} from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http, fallback } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import "@rainbow-me/rainbowkit/styles.css";

const config = createConfig({
    chains: [baseSepolia],
    transports: {
        [baseSepolia.id]: fallback([
            http("https://sepolia.base.org"),
            http("https://base-sepolia-rpc.publicnode.com"),
        ]),
    },
    ssr: true,
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider
                    theme={darkTheme({
                        accentColor: "#F5F4F0",
                        accentColorForeground: "#080808",
                        borderRadius: "none",
                        fontStack: "system",
                    })}
                >
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
