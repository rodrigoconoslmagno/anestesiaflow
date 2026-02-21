package br.com.anestesiaflow.estabelecimento.model;

import br.com.anestesiaflow.framework.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;

@Entity
public class Estabelecimento extends BaseEntity<Integer> {

	private static final long serialVersionUID = -4408592653353281217L;
	
	@Column(length = 60)
	private String nome;
	@Column(length = 7)
	private String cor;
	@Column
	private byte[] icone;
	@Column(length = 5)
	private String sigla;
	@Column
	private boolean ativo;
	
	public String getNome() {
		return nome;
	}
	
	public void setNome(String nome) {
		this.nome = nome;
	}
	
	public String getCor() {
		return cor;
	}
	
	public void setCor(String cor) {
		this.cor = cor;
	}
	
	public String getSigla() {
		return sigla;
	}
	
	public void setSigla(String sigla) {
		this.sigla = sigla;
	}
	
	public byte[] getIcone() {
		return icone;
	}
	
	public void setIcone(byte[] icone) {
		this.icone = icone;
	}
	
	public boolean isAtivo() {
		return ativo;
	}
	
	public void setAtivo(boolean ativo) {
		this.ativo = ativo;
	}
}