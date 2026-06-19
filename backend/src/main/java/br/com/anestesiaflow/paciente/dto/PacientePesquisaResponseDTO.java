package br.com.anestesiaflow.paciente.dto;

public record  PacientePesquisaResponseDTO(
    int id,
    String nome,
    String dataProcedimentoExibir,
    String procedimentoExibir,
    double valorPrevistoExibir,
    double valorEfetivoExibir,
    boolean ativo
) {}