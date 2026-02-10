package br.com.anestesiaflow.estabelecimento.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import br.com.anestesiaflow.estabelecimento.dto.EstabelecimentoRequestDTO;
import br.com.anestesiaflow.estabelecimento.dto.EstabelecimentoResponseDTO;
import br.com.anestesiaflow.estabelecimento.service.EstabelecimentoService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/estabelecimento")
public class EstabelecimentoController {
	
	@Autowired
	private EstabelecimentoService estService;

	@PostMapping("/listar")
	public ResponseEntity<List<?>> listar() {
        return ResponseEntity.ok(estService.listarTodos());
    }
	
	@PostMapping
    public ResponseEntity<EstabelecimentoResponseDTO> criar(@Validated @RequestBody EstabelecimentoRequestDTO dto) {
		EstabelecimentoResponseDTO novoEstabelecimento = estService.salvar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(novoEstabelecimento);
    }
	
	@PutMapping("/{id}")
	public ResponseEntity<EstabelecimentoResponseDTO> atualizar(
	        @PathVariable int id, 
	        @Valid @RequestBody EstabelecimentoRequestDTO request) {
	    
		EstabelecimentoResponseDTO response = estService.atualizar(id, request);
	    return ResponseEntity.ok(response);
	}
	
	@DeleteMapping("/{id}")
	public ResponseEntity<Void> excluir(@PathVariable int id) {
	    estService.excluir(id);
	    return ResponseEntity.noContent().build(); // Retorna 204 No Content (sucesso sem corpo)
	}
}