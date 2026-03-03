package br.com.anestesiaflow.escala.dto;

import java.util.List;

public record EscalaEdicaoDTO(
		int medicoId,
		List<EscalaSemanaDTO> semana 
) {}