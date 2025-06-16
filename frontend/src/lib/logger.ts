// Service de logging standardisé
type LogLevel = 'info' | 'error' | 'debug';

interface LogOptions {
  component?: string;
  details?: any;
}

interface UserInfo {
  email?: string;
  sub?: string;
}

class Logger {
  private static userInfo: UserInfo = {};
  private static machineInfo = {
    platform: navigator.platform,
    userAgent: navigator.userAgent.split(' ').find(x => x.includes('Chrome')),
    language: navigator.language
  };

  static setUserInfo(info: UserInfo) {
    this.userInfo = info;
  }

  private static formatMessage(message: string, options?: LogOptions): string {
    const component = options?.component ? `[${options.component}] ` : '';
    return `${component}${message}`;
  }

  private static getContextInfo() {
    return {
      user: this.userInfo.email || 'Non authentifié',
      machine: {
        platform: this.machineInfo.platform,
        browser: this.machineInfo.userAgent,
        language: this.machineInfo.language
      },
      timestamp: new Date().toISOString()
    };
  }

  private static log(level: LogLevel, message: string, options?: LogOptions) {
    const formattedMessage = this.formatMessage(message, options);
    const context = this.getContextInfo();
    
    switch (level) {
      case 'info':
        console.log(`ℹ️ ${formattedMessage}`, {
          ...options?.details,
          context
        });
        break;
      case 'error':
        console.error(`❌ ${formattedMessage}`, {
          ...options?.details,
          context
        });
        break;
      case 'debug':
        console.log(`🔍 ${formattedMessage}`, {
          ...options?.details,
          context
        });
        break;
    }
  }

  static info(message: string, options?: LogOptions) {
    this.log('info', message, options);
  }

  static error(message: string, options?: LogOptions) {
    this.log('error', message, options);
  }

  static debug(message: string, options?: LogOptions) {
    this.log('debug', message, options);
  }

  static auth(token: string, options?: LogOptions) {
    // Extraire les informations du JWT si possible
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.setUserInfo({
        email: payload.email,
        sub: payload.sub
      });
    } catch (e) {
      // Si le token ne peut pas être décodé, on continue sans les infos
    }

    this.debug(`Token d'authentification`, { 
      ...options,
      details: {
        ...options?.details,
        tokenPreview: `${token.substring(0, 15)}...`
      }
    });
  }

  static request(message: string, options?: LogOptions) {
    this.info(`📤 ${message}`, {
      ...options,
      details: {
        ...options?.details,
        context: this.getContextInfo()
      }
    });
  }

  static response(message: string, options?: LogOptions) {
    this.info(`📥 ${message}`, {
      ...options,
      details: {
        ...options?.details,
        context: this.getContextInfo()
      }
    });
  }
}

export default Logger; 