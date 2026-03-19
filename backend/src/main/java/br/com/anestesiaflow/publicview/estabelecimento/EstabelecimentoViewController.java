package br.com.anestesiaflow.publicview.estabelecimento;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import br.com.anestesiaflow.estabelecimento.dto.EstabelecimentoResponseDTO;
import br.com.anestesiaflow.estabelecimento.service.EstabelecimentoService;
import br.com.anestesiaflow.publicview.BasePublicController;

@RestController
@RequestMapping("/estabelecimento")
public class EstabelecimentoViewController implements BasePublicController {

	@Autowired
	private EstabelecimentoService estService;
	
    @GetMapping("/estabelecimentos")
	public ResponseEntity<List<EstabelecimentoResponseDTO>> listar(@RequestParam(required = false) boolean ativo,
			@RequestParam(required = false) boolean plantao) {
    	if (ativo) {
        	return ResponseEntity.ok(estService.listarAtivos(plantao));
        }
        
        return ResponseEntity.ok(estService.listarTodos());
    }
	
}
