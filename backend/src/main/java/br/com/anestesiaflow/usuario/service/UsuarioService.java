package br.com.anestesiaflow.usuario.service;

import java.util.List;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import br.com.anestesiaflow.entidades.Usuario;
import br.com.anestesiaflow.exception.BusinessException;
import br.com.anestesiaflow.usuario.dto.UsuarioRequestDTO;
import br.com.anestesiaflow.usuario.dto.UsuarioResponseDTO;
import br.com.anestesiaflow.usuario.repository.UsuarioRepository;
import jakarta.transaction.Transactional;

@Service
public class UsuarioService {
	
	private final UsuarioRepository usuarioRepository;
	private final PasswordEncoder passwordEncoder;
	
	public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
		this.usuarioRepository = usuarioRepository;
		this.passwordEncoder = passwordEncoder;
	}
	
	public List<UsuarioResponseDTO> listarTodos() {
        return usuarioRepository.findAll().stream()
                .map(usuario -> mapperToResponseDTO(usuario))
                .toList();
    }
	
	public UsuarioResponseDTO salvar(UsuarioRequestDTO dto) {
		Usuario usuario = mapperToUsuario(dto);
		
		if (usuario.getId() == null && (dto.senha() == null || dto.senha().isBlank())) {
		    throw new BusinessException("Senha é obrigatória para novos usuários");
		}
		
		usuarioRepository.save(usuario);
		return mapperToResponseDTO(usuario);
	}
	
	@Transactional
	public UsuarioResponseDTO atualizar(int id, UsuarioRequestDTO request) {
	    // 1. Busca o usuário existente ou lança exceção (fail-fast)
	    Usuario usuario = usuarioRepository.findById(id)
	            .orElseThrow(() -> new BusinessException("Usuário não encontrado"));

	    if (id == 1 && usuario.getLogin().equals("admin") && !request.login().equals("admin")) {
	    	throw new BusinessException("Não é possóvel alterar o login do Administrador");
	    }
	    
	    usuario = mapperToUsuario(usuario, request);

	    // 4. Salva (O JPA gerencia o update e a dataAlteracao via @LastModifiedDate)
	    Usuario atualizado = usuarioRepository.save(usuario);
	    
	    return mapperToResponseDTO(atualizado);
	}	
	
	@Transactional
	public void excluir(int id) {
	    // Verifica se existe antes de deletar
	    if (!usuarioRepository.existsById(id)) {
	        throw new BusinessException("Usuário não encontrado com o ID: " + id);
	    }
	    
		if (id == 1) {
			throw new BusinessException("Não é possível excluir o Usuário 1(Administrador)");
		}
		
	    usuarioRepository.deleteById(id);
	}
	
	public UsuarioResponseDTO findByLogin(String login) {
		Usuario usuario = usuarioRepository.findByLogin(login)
	            .orElseThrow(() -> new BusinessException("Usuário ou senha inválidos"));
		
		return mapperToResponseDTO(usuario);
	}
	
	public UsuarioResponseDTO findUsuarioByLogin(String login, String senha) {
		Usuario usuario = usuarioRepository.findByLogin(login).orElse(null);
		if (usuario != null && usuario.isAtivo() && passwordEncoder.matches(senha, usuario.getSenha())){
			return mapperToResponseDTO(usuario);			
		}
		
		return null;
	}
	
	private UsuarioResponseDTO mapperToResponseDTO(Usuario usuario) {
		return new UsuarioResponseDTO(usuario.getId(), 
			      usuario.getNome(),
			      usuario.getLogin(),
			      usuario.isAtivo(),
			      usuario.getDataCriacao(),
			      usuario.getDataAtualizacao());
	}
	
	private Usuario mapperToUsuario(UsuarioRequestDTO dto) {
		Usuario usuario = new Usuario();
		usuario.setNome(dto.nome());
		usuario.setLogin(dto.login());
		usuario.setAtivo(dto.ativo());
		usuario.setSenha(passwordEncoder.encode(dto.senha()));
		
		return usuario;
	}
	
	private Usuario mapperToUsuario(Usuario usuario, UsuarioRequestDTO request) {
		usuario.setNome(request.nome());
		usuario.setLogin(request.login());
		usuario.setAtivo(request.ativo());
		if (request.senha() != null && !request.senha().isBlank()) {
			usuario.setSenha(passwordEncoder.encode(request.senha()));
		}
		
		return usuario;
	}
}
