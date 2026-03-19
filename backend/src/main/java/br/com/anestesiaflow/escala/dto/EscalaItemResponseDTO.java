package br.com.anestesiaflow.escala.dto;

import java.time.LocalDateTime;
import java.time.LocalTime;

public record EscalaItemResponseDTO(
		Integer id,
	    int estabelecimentoId,
	    String estabelecimentoSigla,
	    LocalTime hora,
	    String cor,
	    byte[] icone,
	    LocalDateTime arquivado,
	    boolean reagendado) {}