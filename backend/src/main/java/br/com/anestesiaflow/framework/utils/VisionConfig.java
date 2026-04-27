package br.com.anestesiaflow.framework.utils;

import java.io.InputStream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.vision.v1.ImageAnnotatorClient;
import com.google.cloud.vision.v1.ImageAnnotatorSettings;

@Configuration
public class VisionConfig {

    @Value("${app.vision.credentials-path}")
    private String credentialsPath;

    @Bean
    public ImageAnnotatorSettings imageAnnotatorSettings() throws Exception {

        try(InputStream credentialsStream =
                getClass().getClassLoader()
                        .getResourceAsStream(credentialsPath.replace("classpath:", ""))){

	        GoogleCredentials credentials = GoogleCredentials.fromStream(credentialsStream);
	
	        return ImageAnnotatorSettings.newBuilder()
	                .setCredentialsProvider(() -> credentials)
	                .build();
        }
    }
    
    @Bean(destroyMethod = "close")
    public ImageAnnotatorClient imageAnnotatorClient(
            ImageAnnotatorSettings settings) throws Exception {

        return ImageAnnotatorClient.create(settings);
    }
	
}
