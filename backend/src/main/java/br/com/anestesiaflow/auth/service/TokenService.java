package br.com.anestesiaflow.auth.service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTCreationException;
import com.auth0.jwt.exceptions.JWTVerificationException;

import br.com.anestesiaflow.entidades.Usuario;

@Service
public class TokenService {

	@Value("${api.security.token.secrety}")
	private String secrety;
	private final String issuer = "anestesiaflow";
	
	
	public String generateToken(Usuario usuario) {
		try {
			Algorithm algorithm = Algorithm.HMAC256(secrety);
			
			String token = JWT.create()
						.withIssuer(issuer)
						.withSubject(usuario.getLogin())
						.withExpiresAt(generateExpirationDate())
						.sign(algorithm);
			return token;
		} catch (JWTCreationException e) {
			throw new RuntimeException("Eroo na autenticação");
		}
	}
	
	public String validateToken(String token) {
		try {
			Algorithm algorithm = Algorithm.HMAC256(secrety);
			
			return JWT.require(algorithm)
					.withIssuer(issuer)
					.build()
					.verify(token)
					.getSubject();
		} catch (JWTVerificationException e) {
			return null;
		}
	}
	
	private Instant generateExpirationDate() {
		return LocalDateTime.now().plusHours(2).toInstant(ZoneOffset.of("-3"));
	}
}
