package br.com.anestesiaflow.escala.dto;

import java.time.LocalDate;
import java.util.List;

public record EscalaSimetriaEstResponseDTO(
		int estId,
		String estSigla,
		String cor,
		byte[] icone,
		LocalDate dataInicio,
		LocalDate dataFim,
	    List<EscalaSimetriaMedicoResponseDTO> medico) {}