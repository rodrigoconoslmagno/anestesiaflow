package br.com.anestesiaflow.procedimento.dto;

import java.time.LocalDateTime;

public record ProcedimentoResponseDTO(
    	int id,
		String descricao,
		boolean ativo,
		LocalDateTime dataCriacao,
		LocalDateTime dataAtualizacao
) {}