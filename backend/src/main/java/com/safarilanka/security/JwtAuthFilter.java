package com.safarilanka.security;
import jakarta.servlet.*; import jakarta.servlet.http.*; import org.springframework.security.authentication.UsernamePasswordAuthenticationToken; import org.springframework.security.core.context.SecurityContextHolder; import org.springframework.security.web.authentication.WebAuthenticationDetailsSource; import org.springframework.stereotype.Component; import org.springframework.web.filter.OncePerRequestFilter; import java.io.IOException;
@Component
public class JwtAuthFilter extends OncePerRequestFilter {
 private final JwtService jwt; private final CustomUserDetailsService uds; public JwtAuthFilter(JwtService jwt,CustomUserDetailsService uds){this.jwt=jwt;this.uds=uds;}
 @Override protected void doFilterInternal(HttpServletRequest req,HttpServletResponse res,FilterChain chain)throws ServletException,IOException{
  String h=req.getHeader("Authorization"); if(h!=null&&h.startsWith("Bearer ")){String t=h.substring(7); try{String email=jwt.username(t); if(email!=null&&SecurityContextHolder.getContext().getAuthentication()==null){var u=uds.loadUserByUsername(email); if(jwt.valid(t,u)){var a=new UsernamePasswordAuthenticationToken(u,null,u.getAuthorities()); a.setDetails(new WebAuthenticationDetailsSource().buildDetails(req)); SecurityContextHolder.getContext().setAuthentication(a);}}}catch(Exception ignored){}}
  chain.doFilter(req,res);
 }
}
