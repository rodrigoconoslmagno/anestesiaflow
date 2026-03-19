package br.com.anestesiaflow.plantao.dto;

import java.time.LocalDateTime;
import java.time.LocalTime;
import br.com.anestesiaflow.estabelecimento.dto.EstabelecimentoResponseDTO;

public record EscalaItemPlantaoDTO(
		int id,
		EstabelecimentoResponseDTO estabelecimento,
		int estabelecimentoId,
	    LocalDateTime arquivado,
	    boolean reagendado,
	    LocalTime hora,
	    String cor,
	    byte[] icone
) {}