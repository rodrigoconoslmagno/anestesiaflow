package br.com.anestesiaflow.medico.model;

import java.time.LocalDate;

import br.com.anestesiaflow.framework.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;

@Entity
public class Medico extends BaseEntity<Integer> {

	private static final long serialVersionUID = 4597530910556046354L;
	
	@Column(length = 60)
	private String nome;
	@Column(length = 3)
	private String sigla;
	@Column(name = "dataassociacao")
	private LocalDate dataAssociacao;
	@Column
	private boolean ativo;

	public String getNome() {
		return nome;
	}
	
	public void setNome(String nome) {
		this.nome = nome;
	}
	
	public String getSigla() {
		return sigla;
	}
	
	public void setSigla(String sigla) {
		this.sigla = sigla;
	}
	
	public LocalDate getDataAssociacao() {
		return dataAssociacao;
	}
	
	public void setDataAssociacao(LocalDate dataAssociacao) {
		this.dataAssociacao = dataAssociacao;
	}
	
	public boolean isAtivo() {
		return ativo;
	}
	
	public void setAtivo(boolean ativo) {
		this.ativo = ativo;
	}
}
