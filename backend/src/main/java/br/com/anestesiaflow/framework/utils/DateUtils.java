package br.com.anestesiaflow.framework.utils;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Classe utilitária para operações comuns com datas.
 */
public final class DateUtils {

    private static final DateTimeFormatter PT_BR_DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy", Locale.of("pt", "BR"));

    /**
     * Construtor privado para impedir a instanciação da classe utilitária.
     */
    private DateUtils() {
        throw new UnsupportedOperationException("Esta é uma classe utilitária e não pode ser instanciada.");
    }

    /**
     * Formata um objeto LocalDate para o padrão brasileiro (dd/MM/yyyy).
     * @param date A data a ser formatada.
     * @return Uma string com a data formatada ou uma string vazia se a data for nula.
     */
    public static String formatToPtBr(LocalDate date) {
        return date != null ? date.format(PT_BR_DATE_FORMATTER) : "";
    }
}