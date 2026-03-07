package br.com.anestesiaflow.auth.permission;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component("securityUtils")
public class SecurityUtils {

	public boolean hasAuthority(Permissoes authority) {
        return SecurityContextHolder.getContext().getAuthentication()
                .getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(authority.name()+"_1"));
    }
	
}
