package br.com.anestesiaflow.usuario.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import br.com.anestesiaflow.entidades.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {

	@EntityGraph(attributePaths = { "medico", "permissoes" })
	public abstract Optional<Usuario> findByLogin(String login);	
}
