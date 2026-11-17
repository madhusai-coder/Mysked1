package com.mysked.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtService jwtService;

    public JwtAuthFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String header = req.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                String studentId = jwtService.extractStudentId(token);
                if (studentId != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    var auth = new UsernamePasswordAuthenticationToken(studentId, null, Collections.emptyList());
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (Exception ignored) {
                // Invalid or expired token leaves SecurityContext empty -> 401 on protected routes
            }
        }
        chain.doFilter(req, res);
    }
}
