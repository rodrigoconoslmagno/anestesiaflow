package br.com.anestesiaflow.usuario.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import br.com.anestesiaflow.usuario.dto.UsuarioRequestDTO;
import br.com.anestesiaflow.usuario.dto.UsuarioResponseDTO;
import br.com.anestesiaflow.usuario.service.UsuarioService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/usuario")
public class UsuarioController {
	
	private final UsuarioService usuarioService;
	
	public UsuarioController(UsuarioService usuarioService) {
		this.usuarioService = usuarioService;
	}
	
	@PreAuthorize("@auth.has(T(br.com.anestesiaflow.auth.permission.Permissoes).USUARIO_ACESSAR)")
	@PostMapping("/listar")
	public ResponseEntity<List<UsuarioResponseDTO>> listar() {
        return ResponseEntity.ok(usuarioService.listarTodos());
    }

	@PreAuthorize("@auth.has(T(br.com.anestesiaflow.auth.permission.Permissoes).USUARIO_ACESSAR)")
	@PostMapping("/buscarid")
	public ResponseEntity<UsuarioResponseDTO> buscaPorId(@RequestBody Map<String, Integer> payload) {
		Integer id = payload.get("id");
		return ResponseEntity.ok(usuarioService.buscaId(id));
	}
	
	@PreAuthorize("@auth.has(T(br.com.anestesiaflow.auth.permission.Permissoes).USUARIO_NOVO)")
	@PostMapping
    public ResponseEntity<UsuarioResponseDTO> criar(@Validated @RequestBody UsuarioRequestDTO dto) {
        UsuarioResponseDTO novoUsuario = usuarioService.salvar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(novoUsuario);
    }
	
	@PreAuthorize("@auth.has(T(br.com.anestesiaflow.auth.permission.Permissoes).USUARIO_ALTERAR)")
	@PutMapping("/{id}")
	public ResponseEntity<UsuarioResponseDTO> atualizar(
	        @PathVariable int id, 
	        @Valid @RequestBody UsuarioRequestDTO request) {
	    
	    UsuarioResponseDTO response = usuarioService.atualizar(id, request);
	    return ResponseEntity.ok(response);
	}
	
	@PreAuthorize("@auth.has(T(br.com.anestesiaflow.auth.permission.Permissoes).USUARIO_EXCLUIR)")
	@DeleteMapping("/{id}")
	public ResponseEntity<Void> excluir(@PathVariable int id) {
	    usuarioService.excluir(id);
	    return ResponseEntity.noContent().build();
	}
}
