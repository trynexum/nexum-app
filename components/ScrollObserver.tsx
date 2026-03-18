"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollObserver() {
    const pathname = usePathname();

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) {
                        e.target.classList.add("visible");
                    }
                });
            },
            { threshold: 0.12 }
        );

        // Small timeout to ensure DOM is ready after navigation
        const timeout = setTimeout(() => {
            document.querySelectorAll(".fade-up").forEach((el) => observer.observe(el));

            if (window.location.hash) {
                const id = window.location.hash.substring(1);
                const section = document.getElementById(id);
                if (section) {
                    const navHeight = 80;
                    const offsetPosition = section.offsetTop - navHeight;
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: "smooth"
                    });
                    window.history.replaceState(null, "", pathname);
                }
            }
        }, 100);

        return () => {
            clearTimeout(timeout);
            observer.disconnect();
        };
    }, [pathname]);

    return null;
}
