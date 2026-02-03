package br.com.anestesiaflow.auth.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

import br.com.anestesiaflow.auth.repository.UsuarioRepository;
import br.com.anestesiaflow.entidades.Usuario;

@Component
public class UsuarioDetalheService implements UserDetailsService{

	@Autowired
	private UsuarioRepository usuarioRepository;
	
	@Override
	public UserDetails loadUserByUsername(String userName) throws UsernameNotFoundException {
		Usuario usuario = usuarioRepository.findByLogin(userName).orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
		return new User(usuario.getLogin(), usuario.getNome(), null);
	}
	
}