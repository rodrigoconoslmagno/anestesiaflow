package br.com.anestesiaflow.auth.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import br.com.anestesiaflow.auth.dto.LoginRequestDTO;
import br.com.anestesiaflow.auth.dto.LoginResponseDTO;
import br.com.anestesiaflow.auth.repository.UsuarioRepository;
import br.com.anestesiaflow.auth.service.TokenService;
import br.com.anestesiaflow.entidades.Usuario;

@RestController
@RequestMapping("/auth")
public class AuthController {

	private final UsuarioRepository usuarioRepository;
	private final PasswordEncoder passwordEncoder;
	private final TokenService tokenService;
	
	public AuthController(UsuarioRepository usuarioRepository, 
			PasswordEncoder passwordEncoder, TokenService tokenService) {
		this.usuarioRepository = usuarioRepository;
		this.passwordEncoder = passwordEncoder;
		this.tokenService = tokenService;
	}

	@PostMapping("/login")
	public ResponseEntity<LoginResponseDTO> login(@RequestBody LoginRequestDTO body){
		Usuario usuario = usuarioRepository.findByLogin(body.login()).orElseThrow(() -> new RuntimeException("Usuário nãp encontrado"));
		if (passwordEncoder.matches(body.senha(), usuario.getSenha())){
			String token = tokenService.generateToken(usuario);
			ResponseCookie cookie = ResponseCookie.from("accessToken", token)
							.httpOnly(true)
							.secure(false)
							.path("/")
							.maxAge(86400)
							.sameSite("Lax")
							.build();
			return ResponseEntity.ok()
					.header(HttpHeaders.SET_COOKIE, cookie.toString())
					.body(new LoginResponseDTO(usuario.getNome(), token));
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
		
		return ResponseEntity.ok(new LoginResponseDTO(usuario.getNome(), null));
	}
}