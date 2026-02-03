package br.com.anestesiaflow.auth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import br.com.anestesiaflow.auth.repository.UsuarioRepository;
import br.com.anestesiaflow.auth.service.TokenService;
import br.com.anestesiaflow.entidades.Usuario;

import java.io.IOException;
import java.util.Collections;

@Component
public class SecurityFilter extends OncePerRequestFilter {

    private final TokenService tokenService;
    private final UsuarioRepository userRepository;

    public SecurityFilter(TokenService tokenService, UsuarioRepository userRepository) {
        this.tokenService = tokenService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
    	String path = request.getRequestURI();
    	
    	if (path.startsWith("/static/") ||
                path.startsWith("/js/") ||
                path.startsWith("/css/") ||
                path.startsWith("/assets/") ||
                path.endsWith(".png") ||
                path.endsWith(".jpg") ||
                path.endsWith(".jpeg") ||
                path.endsWith(".svg") ||
                path.endsWith(".ico") ||
                path.endsWith(".html") ||
                path.endsWith(".json")) {

                filterChain.doFilter(request, response);
                return;
            }
    	
    	String token = this.recoverToken(request);
        if (token != null && !token.isEmpty()) {
        	String login = tokenService.validateToken(token);
            if (login != null) {
	            Usuario user = userRepository.findByLogin(login).orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
	
	            if (user != null) {
	            	Authentication authentication = new UsernamePasswordAuthenticationToken(user, null, Collections.emptyList());
	                SecurityContextHolder.getContext().setAuthentication(authentication);
	            }
            }
        }
        filterChain.doFilter(request, response);
    }

    private String recoverToken(HttpServletRequest request) {
    	if (request.getCookies() != null) {
    		for (Cookie cookie : request.getCookies()) {
    			if ("accessToken".equals(cookie.getName())) {
    				return cookie.getValue();
    			}
    		}
    	}
    	
        var authHeader = request.getHeader("Authorization");
        if (authHeader == null) return null;
        return authHeader.replace("Bearer ", "");
    }
}