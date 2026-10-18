package com.safarilanka.security;
import io.jsonwebtoken.*; import io.jsonwebtoken.security.Keys; import org.springframework.beans.factory.annotation.Value; import org.springframework.security.core.userdetails.UserDetails; import org.springframework.stereotype.Service;
import java.nio.charset.StandardCharsets; import java.security.Key; import java.util.*; import java.util.function.Function;
@Service
public class JwtService {
 @Value("${app.jwt.secret}") private String secret; @Value("${app.jwt.expiration-ms}") private long expiration;
 private Key key(){return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));}
 public String generate(UserDetails user){return Jwts.builder().setSubject(user.getUsername()).claim("roles",user.getAuthorities().stream().map(Object::toString).toList()).setIssuedAt(new Date()).setExpiration(new Date(System.currentTimeMillis()+expiration)).signWith(key(),SignatureAlgorithm.HS256).compact();}
 public String username(String token){return claim(token,Claims::getSubject);} public Date expiration(String token){return claim(token,Claims::getExpiration);}
 public <T>T claim(String token,Function<Claims,T> fn){return fn.apply(Jwts.parserBuilder().setSigningKey(key()).build().parseClaimsJws(token).getBody());}
 public boolean valid(String token,UserDetails user){return username(token).equalsIgnoreCase(user.getUsername()) && expiration(token).after(new Date());}
}
