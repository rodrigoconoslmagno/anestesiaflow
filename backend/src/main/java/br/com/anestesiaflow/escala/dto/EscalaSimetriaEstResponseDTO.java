package br.com.anestesiaflow.escala.dto;

import java.util.List;

public record EscalaSimetriaEstResponseDTO(
		int estId,
		String estSigla,
		String cor,
		byte[] icone,
	    List<EscalaSimetriaMedicoResponseDTO> medico) {}