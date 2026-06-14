package br.com.anestesiaflow.procedimento.dto;

import jakarta.validation.constraints.NotBlank;

public record ProcedimentoRequestDTO(
        @NotBlank String descricao,
        boolean ativo
) {}