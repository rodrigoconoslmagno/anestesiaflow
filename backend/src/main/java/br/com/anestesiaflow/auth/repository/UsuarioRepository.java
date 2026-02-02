package br.com.anestesiaflow.auth.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.anestesiaflow.auth.entidade.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {

	public Usuario findByLogin(String login);	
}