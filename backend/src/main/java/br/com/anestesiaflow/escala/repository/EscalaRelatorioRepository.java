package br.com.anestesiaflow.escala.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import br.com.anestesiaflow.escala.dto.EscalaResumoAnualClinicaResponseDTO;
import br.com.anestesiaflow.escala.dto.EscalaResumoAnualMedicoResponseDTO;
import br.com.anestesiaflow.escala.dto.EscalaSimetriaDTO;
import br.com.anestesiaflow.escala.entidade.Escala;

public interface EscalaRelatorioRepository extends JpaRepository<Escala, Integer> {

	@Query(value = "SELECT DISTINCT EXTRACT(YEAR FROM e.data) AS ano " +
            "FROM escala e " +
            "ORDER BY ano DESC", nativeQuery = true)
	List<Integer> findAllAnosEscalas();
	
	@Query(value = """
	        SELECT 
	            coalesce(est.sigla, est.nome) AS estabelecimento,
	            est.icone,
	            est.cor,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 1) AS janeiro,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 2) AS fevereiro,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 3) AS marco,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 4) AS abril,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 5) AS maio,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 6) AS junho,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 7) AS julho,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 8) AS agosto,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 9) AS setembro,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 10) AS outubro,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 11) AS novembro,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 12) AS dezembro,
	            COUNT(ei.id) AS total_ano
	        FROM 
	            estabelecimento est
	        LEFT JOIN 
	            escala e ON e.medicoid = :medicoId and EXTRACT(YEAR FROM e.data) = :ano
			LEFT JOIN 
	            escalaitem ei ON ei.escalaid = e.id and est.id = ei.estabelecimentoid	            
	        GROUP BY 
	            coalesce(est.sigla, est.nome),  est.icone, est.cor
	        ORDER BY 
	            coalesce(est.sigla, est.nome)
	        """, nativeQuery = true)
	    List<EscalaResumoAnualMedicoResponseDTO> findResumoAnualByMedico(@Param("medicoId") int medicoId, @Param("ano") int ano);
	
	@Query(value = """
	        SELECT 
	            m.sigla AS sigla,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 1) AS janeiro,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 2) AS fevereiro,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 3) AS marco,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 4) AS abril,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 5) AS maio,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 6) AS junho,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 7) AS julho,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 8) AS agosto,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 9) AS setembro,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 10) AS outubro,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 11) AS novembro,
	            COUNT(ei.id) FILTER (WHERE EXTRACT(MONTH FROM e.data) = 12) AS dezembro,
	            COUNT(ei.id) AS total_ano
	        FROM 
	            medico m
	        LEFT JOIN 
	            escala e ON e.medicoid = m.id and EXTRACT(YEAR FROM e.data) = :ano
	        LEFT JOIN 
	            escalaitem ei ON ei.escalaid = e.id and ei.estabelecimentoid = :estId
	        GROUP BY 
	            m.sigla, m.dataassociacao
	        ORDER BY 
	            m.dataassociacao
	        """, nativeQuery = true)
	    List<EscalaResumoAnualClinicaResponseDTO> findResumoAnualByClinica(@Param("estId") int medicoId, @Param("ano") int ano);
		
	
	@Query(value = """
	        SELECT 
	            base.sigla,
	            base.cor,
	            base.icone,
	            base.estid,
	            base.datainicio,
				base.datafim,
	            jsonb_agg(
	                jsonb_build_object('sigla', base.sigla_medico, 'medicoid', base.medicoid,'total', base.total)
	                ORDER BY base.total ASC, base.dataassociacao ASC
	            ) AS dadosMedicos
	        FROM (
	            SELECT 
	                e.sigla AS sigla,
	                e.cor,
	                e.icone,
	                m.id as medicoid,
	                e.id as estid,
	                m.sigla AS sigla_medico,
	                m.dataassociacao,
	                (CURRENT_DATE - INTERVAL '90 days')::date AS datainicio,
					(CURRENT_DATE + INTERVAL '30 days')::date AS datafim,
	                COALESCE(contagem.total, 0) AS total
	            FROM estabelecimento e
	            CROSS JOIN medico m
	            LEFT JOIN (
	                SELECT ei.estabelecimentoid, esc.medicoid, COUNT(ei.id) AS total
	                FROM escalaitem ei
	                JOIN escala esc ON ei.escalaid = esc.id
	                WHERE esc.data >= (CURRENT_DATE - INTERVAL '90 days')
			     	  AND esc.data <= (CURRENT_DATE + INTERVAL '30 days')
			     	  AND ((esc.plantao = false AND ei.arquivado is not null AND :arquivado = 'A') OR
			     	       (esc.plantao = false AND ei.reagendado = false AND :arquivado = 'E') OR 
			     	       (esc.plantao = true AND ei.reagendado = false AND :arquivado = 'PE') OR
			     	       (esc.plantao = true AND ei.arquivado is not null AND :arquivado = 'PA'))
	                GROUP BY ei.estabelecimentoid, esc.medicoid
	            ) contagem ON contagem.estabelecimentoid = e.id AND contagem.medicoid = m.id
	            where m.ativo = true and e.ativo = true 
	        ) base
	        GROUP BY base.sigla, base.cor, base.icone, base.estid, base.datainicio, base.datafim
	        ORDER BY base.sigla
	        """, nativeQuery = true)
	    List<EscalaSimetriaDTO> buscarRelatorioAssimetria(@Param("arquivado") String arquivado);
}
