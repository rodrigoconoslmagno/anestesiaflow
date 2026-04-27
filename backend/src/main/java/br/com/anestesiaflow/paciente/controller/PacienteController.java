package br.com.anestesiaflow.paciente.controller;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import br.com.anestesiaflow.paciente.dto.PacienteRequestDTO;
import br.com.anestesiaflow.paciente.dto.PacienteResponseDTO;
import br.com.anestesiaflow.paciente.service.PacienteService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/paciente")
public class PacienteController {

	@Autowired
	private PacienteService pacienteService;
	
	@PreAuthorize("@auth.has(T(br.com.anestesiaflow.auth.permission.Permissoes).PACIENTE_ACESSAR)")
	@PostMapping("/listar")
	public ResponseEntity<List<PacienteResponseDTO>> listar(@RequestBody(required = false) Map<String, Object> filtros) {
        if (filtros != null && filtros.get("ativo") != null) {
        	return ResponseEntity.ok(pacienteService.listarAtivos());
        }
        
        return ResponseEntity.ok(pacienteService.listarTodos());
    }
	
	@PreAuthorize("@auth.has(T(br.com.anestesiaflow.auth.permission.Permissoes).PACIENTE_ACESSAR)")
	@PostMapping("/buscarid")
	public ResponseEntity<PacienteResponseDTO> buscaPorId(@RequestBody Map<String, Integer> payload) {
		Integer id = payload.get("id");
		return ResponseEntity.ok(pacienteService.buscaId(id));
	}

	@PreAuthorize("@auth.has(T(br.com.anestesiaflow.auth.permission.Permissoes).PACIENTE_NOVO)")
	@PostMapping
    public ResponseEntity<PacienteResponseDTO> criar(@Validated @RequestBody PacienteRequestDTO dto) {
        PacienteResponseDTO novoPaciente = pacienteService.salvar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(novoPaciente);
    }
	
	@PreAuthorize("@auth.has(T(br.com.anestesiaflow.auth.permission.Permissoes).PACIENTE_ALTERAR)")
	@PutMapping("/{id}")
	public ResponseEntity<PacienteResponseDTO> atualizar(
	        @PathVariable int id, 
	        @Valid @RequestBody PacienteRequestDTO request) {
	    
		PacienteResponseDTO response = pacienteService.atualizar(id, request);
	    return ResponseEntity.ok(response);
	}
	
	@PreAuthorize("@auth.has(T(br.com.anestesiaflow.auth.permission.Permissoes).PACIENTE_EXCLUIR)")
	@DeleteMapping("/{id}")
	public ResponseEntity<Void> excluir(@PathVariable int id) {
	    pacienteService.excluir(id);
	    return ResponseEntity.noContent().build();
	}
	
	@PostMapping("/decode")
	public ResponseEntity<String> upload(@RequestParam @Validated int medicoId,
					@RequestParam MultipartFile file) throws Exception {

	   File temp = File.createTempFile("img", ".jpg");
	   file.transferTo(temp);
	   try(InputStream stream = new FileInputStream(temp.getAbsolutePath())){
		   pacienteService.decodeImagem(stream, medicoId);
		   return ResponseEntity.ok().build();
	   }
	}
}