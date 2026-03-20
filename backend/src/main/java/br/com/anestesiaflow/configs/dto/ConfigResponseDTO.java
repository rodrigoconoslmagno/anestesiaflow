package br.com.anestesiaflow.configs.dto;

import br.com.anestesiaflow.configs.ui.UIComponentType;

public record ConfigResponseDTO(
		String chave,
	    String valor,
	    String label,
	    UIComponentType componentType,
	    String inputMode,
	    String placeholder,
	    boolean required
) {}