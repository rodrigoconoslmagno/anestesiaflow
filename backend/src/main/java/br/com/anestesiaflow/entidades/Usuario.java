package br.com.anestesiaflow.entidades;

import br.com.anestesiaflow.framework.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;

@Entity
public class Usuario extends BaseEntity<Integer>{
	
	private static final long serialVersionUID = -3403779918345560441L;
	
	@Column(length = 60)
	private String nome;
	@Column(length = 60, unique = true)
	private String login;
	@Column(length = 255)
	private String senha;
	
	public String getNome() {
		return nome;
	}
	
	public void setNome(String nome) {
		this.nome = nome;
	}
	
	public String getLogin() {
		return login;
	}
	
	public void setLogin(String login) {
		this.login = login;
	}
	
	public String getSenha() {
		return senha;
	}
	
	public void setSenha(String senha) {
		this.senha = senha;
	}
}
