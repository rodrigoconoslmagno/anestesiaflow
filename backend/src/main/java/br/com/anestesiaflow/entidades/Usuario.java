package br.com.anestesiaflow.entidades;

import java.util.HashSet;
import java.util.Set;

import br.com.anestesiaflow.auth.permission.Permissoes;
import br.com.anestesiaflow.framework.persistence.BaseEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;

@Entity
public class Usuario extends BaseEntity<Integer>{
	
	private static final long serialVersionUID = -3403779918345560441L;
	
	@Column(length = 60)
	private String nome;
	@Column(length = 60, unique = true)
	private String login;
	@Column(length = 255)
	private String senha;
	@Column
	private boolean ativo;
	
	@ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "usuariopermissao", joinColumns = @JoinColumn(name = "usuarioid"))
    @Enumerated(EnumType.STRING)
    private Set<Permissoes> permissoes = new HashSet<>();
	
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
	
	public boolean isAtivo() {
		return ativo;
	}
	
	public void setAtivo(boolean ativo) {
		this.ativo = ativo;
	}
	
	public Set<Permissoes> getPermissoes() {
		return permissoes;
	}
}