package br.com.anestesiaflow.escala.dto;

import java.util.Date;

public record EscalaSemanaSummaryDTO(
		int id,
	    String medicoNome,
	    String medicoSigla,
		Date dataInicio,
		Date dataFim) {}