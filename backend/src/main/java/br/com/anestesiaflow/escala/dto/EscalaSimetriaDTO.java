package br.com.anestesiaflow.escala.dto;

import java.time.LocalDate;

public interface EscalaSimetriaDTO {
	String getSigla();
	String getCor();
	byte[] getIcone();
	int getEstId();
	LocalDate getDataInicio();
	LocalDate getDataFim();
    String getDadosMedicos();
}
