package br.com.anestesiaflow.auth.controller;

import java.util.Arrays;
import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import br.com.anestesiaflow.auth.dto.LoginRequestDTO;
import br.com.anestesiaflow.auth.dto.LoginResponseDTO;
import br.com.anestesiaflow.auth.permission.Permissoes;
import br.com.anestesiaflow.auth.service.TokenService;
import br.com.anestesiaflow.entidades.Usuario;
import br.com.anestesiaflow.usuario.service.UsuarioService;

@RestController
@RequestMapping("/auth")
public class AuthController {

	private final UsuarioService usuarioService;
	private final TokenService tokenService;
	
	public AuthController(UsuarioService usuarioService, TokenService tokenService) {
		this.usuarioService = usuarioService;
		this.tokenService = tokenService;
	}

	@PostMapping("/login")
	public ResponseEntity<LoginResponseDTO> login(@RequestBody LoginRequestDTO body){
		LoginResponseDTO usuario = usuarioService.findUsuarioByLogin(body.login(), body.senha());
		if (usuario != null){
			String token = tokenService.generateToken(usuario.login());
			ResponseCookie cookie = ResponseCookie.from("accessToken", token)
							.httpOnly(true)
							.secure(false)
							.path("/")
							.maxAge(86400)
							.sameSite("Lax")
							.build();
			return ResponseEntity.ok()
					.header(HttpHeaders.SET_COOKIE, cookie.toString())
					.body(new LoginResponseDTO(usuario.nome(), 
											   usuario.login(),
											   usuario.medicoId(),
											   usuario.medicoExibir(),
											   usuario.permissoes()));
		}
		
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
	}
	
	@PostMapping("/logout")
	public ResponseEntity<Void> logout(){
		SecurityContextHolder.clearContext();
		
		ResponseCookie cookie = ResponseCookie.from("accessToken", null)
					.httpOnly(true)
					.path("/")
					.maxAge(0)
					.build();
		
		return ResponseEntity.ok()
					.header(HttpHeaders.SET_COOKIE, cookie.toString())
					.build();
	}
	
	@GetMapping("/me")
	public ResponseEntity<LoginResponseDTO> getCurrentUser(@AuthenticationPrincipal Usuario usuario) {
		if (usuario == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		}

		String medicoExibir = null;
		if (usuario.getMedico() != null) {
			medicoExibir = usuario.getMedico().getNome();
			if (usuario.getMedico().getSigla() != null && !usuario.getMedico().getSigla().isBlank()) {
				medicoExibir += " - " + usuario.getMedico().getSigla();
			}
		}
		
		return ResponseEntity.ok(new LoginResponseDTO(usuario.getNome(), 
								usuario.getLogin(),
								usuario.getMedico() != null ? usuario.getMedico().getId() : null,
								medicoExibir,
								analisaRetornoPermissoes(usuario)));
	}
	
	private List<Permissoes> analisaRetornoPermissoes(Usuario usuario){
		if (usuario.getLogin().equalsIgnoreCase("admin")) {
			return Arrays.asList(Permissoes.values());
		} 
		
		return usuario.getPermissoes().parallelStream().toList();
	}
}
