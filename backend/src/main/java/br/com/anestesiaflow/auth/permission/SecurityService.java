package br.com.anestesiaflow.auth.permission;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component("auth")
public class SecurityService {

	public boolean has(Permissoes permissao) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }

        return auth.getAuthorities().stream()
                   .anyMatch(a -> a.getAuthority().equals(permissao.name()));
    }
	
}