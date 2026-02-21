package br.com.anestesiaflow.escala.dto;

import java.time.LocalDate;
import java.util.List;

public record EscalaSemanaDTO(
	int medicoId,
    String medicoNome,
    String medicoSigla,
	LocalDate dataInicio,
	LocalDate dataFim,
	List<EscalaResponseDTO> escala
) {}