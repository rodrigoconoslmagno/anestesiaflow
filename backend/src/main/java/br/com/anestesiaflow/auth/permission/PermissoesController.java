package br.com.anestesiaflow.auth.permission;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/permissoes")
public class PermissoesController {

	@PostMapping("/metadata")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<PermissoesDTO>> listarMetadados() {
        List<PermissoesDTO> metadata = Stream.of(Permissoes.values())
            .map(p -> new PermissoesDTO(
                p.name(), 
                p.getModulo(), 
                p.getDescricao(), 
                p.getAcao(), 
                p.getIcone(),
            	p.isExibirNoMenu(),
            	p.getRota()))
            .collect(Collectors.toList());
            
        return ResponseEntity.ok(metadata);
    }
	
}