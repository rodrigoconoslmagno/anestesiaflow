export const IconeSirenePlantao = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg 
        viewBox="0 0 24 24" 
        className={className} 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
    >
        {/* Base da Sirene (Cinza Escuro/Preto) */}
        <path d="M4 19h16v2H4v-2z" fill="#4B5563" />
        <path d="M6 17h12v2H6v-2z" fill="#6B7280" />
        
        {/* Domo Vermelho (Corpo Principal) */}
        <path d="M12 3c-4.418 0-8 3.582-8 8v6h16v-6c0-4.418-3.582-8-8-8z" fill="#EF4444" />
        
        {/* Detalhe de Brilho no Domo (Luz) */}
        <path d="M11 5c-3.314 0-6 2.686-6 6v1h12v-1c0-3.314-2.686-6-6-6z" fill="#F87171" opacity="0.6" />
        
        {/* Faixa Central (Reflexo da Luz) */}
        <path d="M8 11h8v2H8v-2z" fill="white" opacity="0.4" />
        
        {/* Botão Superior/Antena (Opcional, mas detalhe do emoji) */}
        <circle cx="12" cy="2" r="1" fill="#4B5563" />
    </svg>
);