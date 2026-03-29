package com.chess.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MoveRequest {
    private String from;
    private String to;
    private String promotion; // Optional: q, r, b, n
    private String fen;      // Current board state after move
    private String gameId;   // Unique ID for the session
}
